import { ObjectId } from "mongodb";

/**
 * Categorías de Rolo. Deben coincidir con las de la app (puntos.service.ts).
 */
export const CATEGORIAS = [
    "reporte",
    "casa",
    "mirador",
    "parque",
    "biblioteca",
    "museo",
    "monumento",
    "restaurante",
    "centro_comercial",
    "aeropuerto",
    "otro",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

/**
 * Ubicación en formato GeoJSON. MongoDB la necesita así para poder
 * buscar "puntos cerca de mí" con un índice 2dsphere.
 * Ojo: GeoJSON guarda primero la longitud y luego la latitud.
 */
export interface Ubicacion {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
}

/**
 * Documento que se guarda en la colección "puntos".
 */
export interface Punto {
    _id?: ObjectId;
    nombre: string;
    nota: string;
    categoria: Categoria;
    direccion: string;
    ubicacion: Ubicacion;
    // Solo para reportes (huecos, daños)
    resuelto: boolean;
    fechaArreglo: Date | null;
    // Cuántas personas confirmaron "yo también lo vi"
    confirmaciones: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Lo que el cliente (la app Rolo) puede enviar.
 * El id, las fechas y los contadores los pone el servidor.
 */
export interface PuntoDTO {
    nombre?: string;
    nota?: string;
    categoria?: string;
    direccion?: string;
    lat?: number;
    lng?: number;
}

/**
 * Filtros opcionales para listar: GET /puntos?categoria=reporte&lat=4.6&lng=-74.07&radio=500
 */
export interface FiltrosPuntos {
    categoria?: Categoria;
    resuelto?: boolean;
    cerca?: { lat: number; lng: number; radio: number };
    limite: number;
}

/**
 * Cómo se le responde a la app: con lat y lng sueltos, más fáciles de usar
 * que el GeoJSON, y con el id como texto.
 */
export interface PuntoRespuesta {
    id: string;
    nombre: string;
    nota: string;
    categoria: Categoria;
    direccion: string;
    lat: number;
    lng: number;
    resuelto: boolean;
    fechaArreglo: Date | null;
    confirmaciones: number;
    createdAt: Date;
    updatedAt: Date;
}

export const aRespuesta = (punto: Punto): PuntoRespuesta => ({
    id: punto._id!.toHexString(),
    nombre: punto.nombre,
    nota: punto.nota,
    categoria: punto.categoria,
    direccion: punto.direccion,
    lat: punto.ubicacion.coordinates[1],
    lng: punto.ubicacion.coordinates[0],
    resuelto: punto.resuelto,
    fechaArreglo: punto.fechaArreglo,
    confirmaciones: punto.confirmaciones,
    createdAt: punto.createdAt,
    updatedAt: punto.updatedAt,
});
