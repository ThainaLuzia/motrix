import { supabase } from '../lib/supabase.ts'
import type { Category, Part } from '../types/part.ts'

/** Linha da tabela public.pecas (nomes de coluna em snake_case). */
interface PartRow {
  id: string
  name: string
  category_id: string
  oem_number: string | null
  brand: string
  model: string
  version: string | null
  year_start: number | null
  year_end: number | null
  body_type: Part['compatibility']['bodyType'] | null
  axle: Part['compatibility']['axle'] | null
  side: Part['compatibility']['side'] | null
  condition: Part['condition']
  damage_description: string | null
  color: string | null
  cost: number | string | null
  sale_price: number | string | null
  status: Part['status']
  tags: string[]
  created_at: string
  updated_at: string
  categorias: { name: string } | null
  peca_fotos: { storage_path: string; position: number }[] | null
}

/** Bucket do Supabase Storage onde ficam os arquivos das fotos (as linhas vão em public.peca_fotos). */
export const PHOTOS_BUCKET = 'pecas-fotos'

/** Limites espelhados das constraints peca_fotos_mime_valid e peca_fotos_size_valid. */
export const PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const PHOTO_EXTENSIONS: Record<(typeof PHOTO_MIME_TYPES)[number], string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

export function isAllowedPhoto(file: File) {
  return (PHOTO_MIME_TYPES as readonly string[]).includes(file.type) && file.size <= MAX_PHOTO_BYTES
}

const PART_COLUMNS =
  'id, name, category_id, oem_number, brand, model, version, year_start, year_end, body_type, axle, side, condition, damage_description, color, cost, sale_price, status, tags, created_at, updated_at, categorias(name), peca_fotos(storage_path, position)'

/** Validade das URLs assinadas das fotos (em segundos). */
const PHOTO_URL_TTL_SECONDS = 60 * 60

/** Caminhos das fotos de uma linha, na ordem de position. */
function photoPaths(row: PartRow) {
  return [...(row.peca_fotos ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((photo) => photo.storage_path)
}

/**
 * Gera URLs assinadas (funciona com bucket privado) para vários caminhos em uma única chamada.
 * Falha ao assinar não derruba a listagem: a peça só fica sem preview.
 */
async function signPhotoUrls(paths: string[]) {
  const urls = new Map<string, string>()
  if (paths.length === 0) return urls
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS)
  if (error) {
    console.error('Falha ao gerar URLs das fotos:', error.message)
    return urls
  }
  for (const item of data) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  }
  return urls
}

function withPhotoUrls(part: Part, paths: string[], urls: Map<string, string>): Part {
  return { ...part, photoUrls: paths.flatMap((path) => urls.get(path) ?? []) }
}

/** numeric(12,2) pode chegar como string; converte para number. */
function toNumber(value: number | string | null) {
  return value === null ? undefined : Number(value)
}

function fromRow(row: PartRow): Part {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    category: row.categorias?.name ?? '',
    oemNumber: row.oem_number ?? undefined,
    compatibility: {
      brand: row.brand,
      model: row.model,
      version: row.version ?? undefined,
      yearStart: row.year_start ?? undefined,
      yearEnd: row.year_end ?? undefined,
      bodyType: row.body_type ?? undefined,
      axle: row.axle ?? undefined,
      side: row.side ?? undefined,
    },
    condition: row.condition,
    damageDescription: row.damage_description ?? undefined,
    color: row.color ?? undefined,
    cost: toNumber(row.cost),
    salePrice: toNumber(row.sale_price),
    status: row.status,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Traduz os erros mais comuns do Postgres/PostgREST para mensagens do formulário. */
function toFriendlyError(error: { code?: string; message: string }) {
  if (error.code === '23505') return new Error('Já existe um registro com esse nome.')
  if (error.code === '23514') return new Error(`Dados inválidos: ${error.message}`)
  if (error.code === '42501') return new Error('Sem permissão. Faça login novamente.')
  // .single() sem linha: com RLS, update em linha de outro usuário (ou já apagada) não dá erro, só 0 linhas.
  if (error.code === 'PGRST116') return new Error('Peça não encontrada ou sem permissão para alterá-la.')
  return new Error(error.message)
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categorias').select('id, name').order('name')
  if (error) throw toFriendlyError(error)
  return data
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ name })
    .select('id, name')
    .single()
  if (error) throw toFriendlyError(error)
  return data
}

export async function fetchParts(): Promise<Part[]> {
  const { data, error } = await supabase
    .from('pecas')
    .select(PART_COLUMNS)
    .order('created_at', { ascending: false })
    .returns<PartRow[]>()
  if (error) throw toFriendlyError(error)

  const pathsByRow = data.map(photoPaths)
  const urls = await signPhotoUrls(pathsByRow.flat())
  return data.map((row, index) => withPhotoUrls(fromRow(row), pathsByRow[index], urls))
}

/**
 * Envia as fotos para o Storage e registra cada uma em peca_fotos.
 * Caminho: <user_id>/<peca_id>/<uuid>.<ext> (validado pelo trigger validar_propriedade_e_caminho_foto).
 * Se algo falhar, remove os arquivos já enviados e relança o erro.
 */
async function uploadPartPhotos(partId: string, photos: File[]) {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Sessão expirada. Faça login novamente.')

  const uploadedPaths: string[] = []
  try {
    const rows = []
    for (const [position, file] of photos.entries()) {
      if (!isAllowedPhoto(file)) {
        throw new Error(`A foto "${file.name}" precisa ser PNG, JPG ou WEBP de até 5 MB.`)
      }
      const extension = PHOTO_EXTENSIONS[file.type as keyof typeof PHOTO_EXTENSIONS]
      const storagePath = `${userId}/${partId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw new Error(`Falha ao enviar "${file.name}": ${uploadError.message}`)
      uploadedPaths.push(storagePath)

      rows.push({
        peca_id: partId,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        position,
      })
    }

    const { error } = await supabase.from('peca_fotos').insert(rows)
    if (error) throw toFriendlyError(error)
    return uploadedPaths
  } catch (err) {
    if (uploadedPaths.length > 0) await supabase.storage.from(PHOTOS_BUCKET).remove(uploadedPaths)
    throw err
  }
}

/** Colunas editáveis de public.pecas; user_id, id, created_at e updated_at ficam com o banco. */
function toRowValues(part: Part) {
  const { compatibility: c } = part
  return {
    name: part.name,
    category_id: part.categoryId,
    oem_number: part.oemNumber ?? null,
    brand: c.brand,
    model: c.model,
    version: c.version ?? null,
    year_start: c.yearStart ?? null,
    year_end: c.yearEnd ?? null,
    body_type: c.bodyType ?? null,
    axle: c.axle ?? null,
    side: c.side ?? null,
    condition: part.condition,
    damage_description: part.damageDescription ?? null,
    color: part.color ?? null,
    cost: part.cost ?? null,
    sale_price: part.salePrice ?? null,
    status: part.status,
    tags: part.tags,
  }
}

/**
 * Insere a peça e, se houver, suas fotos; user_id, id, created_at e updated_at são preenchidos pelo banco.
 * Se as fotos falharem, a peça é apagada para não ficar um cadastro pela metade.
 */
export async function createPart(part: Part): Promise<Part> {
  const { data, error } = await supabase
    .from('pecas')
    .insert(toRowValues(part))
    .select(PART_COLUMNS)
    .single<PartRow>()
  if (error) throw toFriendlyError(error)

  let storagePaths: string[] = []
  if (part.photos && part.photos.length > 0) {
    try {
      storagePaths = await uploadPartPhotos(data.id, part.photos)
    } catch (err) {
      // ON DELETE CASCADE em peca_fotos limpa as linhas que tiverem sido gravadas.
      await supabase.from('pecas').delete().eq('id', data.id)
      throw err
    }
  }

  const urls = await signPhotoUrls(storagePaths)
  return withPhotoUrls({ ...fromRow(data), photos: part.photos }, storagePaths, urls)
}

/** Atualiza os dados da peça (as fotos não mudam) e devolve a linha salva, com updated_at novo. */
export async function updatePart(id: string, part: Part): Promise<Part> {
  const { data, error } = await supabase
    .from('pecas')
    .update(toRowValues(part))
    .eq('id', id)
    .select(PART_COLUMNS)
    .single<PartRow>()
  if (error) throw toFriendlyError(error)

  const paths = photoPaths(data)
  const urls = await signPhotoUrls(paths)
  return withPhotoUrls(fromRow(data), paths, urls)
}

/**
 * Apaga a peça. As linhas de peca_fotos saem pelo ON DELETE CASCADE; os arquivos do
 * Storage são removidos depois (se isso falhar, a peça já foi apagada e só sobra o arquivo órfão).
 */
export async function deletePart(id: string): Promise<void> {
  const { data: photos, error: photosError } = await supabase
    .from('peca_fotos')
    .select('storage_path')
    .eq('peca_id', id)
  if (photosError) throw toFriendlyError(photosError)

  // Com RLS, apagar linha de outro usuário não dá erro: só volta vazio.
  const { data, error } = await supabase.from('pecas').delete().eq('id', id).select('id')
  if (error) throw toFriendlyError(error)
  if (data.length === 0) throw new Error('Peça não encontrada ou sem permissão para excluí-la.')

  const paths = photos.map((photo) => photo.storage_path)
  if (paths.length === 0) return
  const { error: storageError } = await supabase.storage.from(PHOTOS_BUCKET).remove(paths)
  if (storageError) console.error('Falha ao remover fotos do Storage:', storageError.message)
}
