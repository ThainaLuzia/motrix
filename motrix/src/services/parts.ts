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
  categorias: { name: string } | null
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
  'id, name, category_id, oem_number, brand, model, version, year_start, year_end, body_type, axle, side, condition, damage_description, color, cost, sale_price, status, tags, categorias(name)'

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
  }
}

/** Traduz os erros mais comuns do Postgres/PostgREST para mensagens do formulário. */
function toFriendlyError(error: { code?: string; message: string }) {
  if (error.code === '23505') return new Error('Já existe um registro com esse nome.')
  if (error.code === '23514') return new Error(`Dados inválidos: ${error.message}`)
  if (error.code === '42501') return new Error('Sem permissão. Faça login novamente.')
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
  return data.map(fromRow)
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
  } catch (err) {
    if (uploadedPaths.length > 0) await supabase.storage.from(PHOTOS_BUCKET).remove(uploadedPaths)
    throw err
  }
}

/**
 * Insere a peça e, se houver, suas fotos; user_id, id, created_at e updated_at são preenchidos pelo banco.
 * Se as fotos falharem, a peça é apagada para não ficar um cadastro pela metade.
 */
export async function createPart(part: Part): Promise<Part> {
  const { compatibility: c } = part
  const { data, error } = await supabase
    .from('pecas')
    .insert({
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
    })
    .select(PART_COLUMNS)
    .single<PartRow>()
  if (error) throw toFriendlyError(error)

  if (part.photos && part.photos.length > 0) {
    try {
      await uploadPartPhotos(data.id, part.photos)
    } catch (err) {
      // ON DELETE CASCADE em peca_fotos limpa as linhas que tiverem sido gravadas.
      await supabase.from('pecas').delete().eq('id', data.id)
      throw err
    }
  }

  return { ...fromRow(data), photos: part.photos }
}
