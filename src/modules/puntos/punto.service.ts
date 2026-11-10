import { ObjectId } from "mongodb";
import { BadRequestError, NotFoundError } from "../../shared/errors/AppError";
import { CATEGORIAS, Categoria, FiltrosPuntos, Punto, PuntoDTO } from "./punto.model";
import { PuntoRepository } from "./punto.repository";

const LIMITE_POR_DEFECTO = 200;
const LIMITE_MAXIMO = 500;
const RADIO_MAXIMO = 50_000; // 50 km

export class PuntoService {

    private readonly puntoRepository = new PuntoRepository();

    async create(data: PuntoDTO): Promise<Punto> {
        const nombre = this.optionalString(data?.nombre, "nombre", 80);
        const nota = this.optionalString(data?.nota, "nota", 500);
        const direccion = this.optionalString(data?.direccion, "direccion", 200);
        const categoria = this.requireCategoria(data?.categoria);
        const { lat, lng } = this.requireCoordenadas(data?.lat, data?.lng);

        const now = new Date();
        return this.puntoRepository.create({
            nombre,
            nota,
            categoria,
            direccion,
            ubicacion: { type: "Point", coordinates: [lng, lat] },
            resuelto: false,
            fechaArreglo: null,
            confirmaciones: 0,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Lee los filtros que llegan en la URL (?categoria=&resuelto=&lat=&lng=&radio=&limite=).
     */
    async findAll(query: Record<string, unknown>): Promise<Punto[]> {
        const filtros: FiltrosPuntos = { limite: LIMITE_POR_DEFECTO };

        if (query.categoria !== undefined) {
            filtros.categoria = this.requireCategoria(query.categoria);
        }
        if (query.resuelto !== undefined) {
            if (query.resuelto !== "true" && query.resuelto !== "false") {
                throw new BadRequestError("El filtro 'resuelto' debe ser true o false");
            }
            filtros.resuelto = query.resuelto === "true";
        }
        if (query.lat !== undefined || query.lng !== undefined) {
            const { lat, lng } = this.requireCoordenadas(Number(query.lat), Number(query.lng));
            const radio = query.radio === undefined ? 1000 : Number(query.radio);
            if (!Number.isFinite(radio) || radio <= 0 || radio > RADIO_MAXIMO) {
                throw new BadRequestError(`El 'radio' debe ser un número de metros entre 1 y ${RADIO_MAXIMO}`);
            }
            filtros.cerca = { lat, lng, radio };
        }
        if (query.limite !== undefined) {
            const limite = Number(query.limite);
            if (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MAXIMO) {
                throw new BadRequestError(`El 'limite' debe ser un entero entre 1 y ${LIMITE_MAXIMO}`);
            }
            filtros.limite = limite;
        }

        return this.puntoRepository.findAll(filtros);
    }

    async findById(id: string): Promise<Punto> {
        const punto = await this.puntoRepository.findById(this.toObjectId(id));
        if (!punto) {
            throw new NotFoundError("Punto no encontrado");
        }
        return punto;
    }

    async update(id: string, data: PuntoDTO): Promise<Punto> {
        const objectId = this.toObjectId(id);
        const changes: Partial<Punto> = {};

        if (data.nombre !== undefined) changes.nombre = this.optionalString(data.nombre, "nombre", 80);
        if (data.nota !== undefined) changes.nota = this.optionalString(data.nota, "nota", 500);
        if (data.direccion !== undefined) changes.direccion = this.optionalString(data.direccion, "direccion", 200);
        if (data.categoria !== undefined) changes.categoria = this.requireCategoria(data.categoria);
        if (data.lat !== undefined || data.lng !== undefined) {
            const { lat, lng } = this.requireCoordenadas(data.lat, data.lng);
            changes.ubicacion = { type: "Point", coordinates: [lng, lat] };
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestError("No se enviaron campos para actualizar");
        }
        changes.updatedAt = new Date();

        return this.ensureFound(await this.puntoRepository.update(objectId, changes));
    }

    // "Yo también lo vi": suma una confirmación al reporte.
    async confirmar(id: string): Promise<Punto> {
        return this.ensureFound(await this.puntoRepository.confirmar(this.toObjectId(id)));
    }

    // Marca un reporte como arreglado (o lo vuelve a abrir con { "resuelto": false }).
    async cambiarEstado(id: string, resuelto: unknown): Promise<Punto> {
        const valor = resuelto === undefined ? true : resuelto;
        if (typeof valor !== "boolean") {
            throw new BadRequestError("El campo 'resuelto' debe ser true o false");
        }
        const punto = await this.findById(id);
        if (punto.categoria !== "reporte") {
            throw new BadRequestError("Solo los reportes (huecos, daños) se pueden marcar como arreglados");
        }
        const now = new Date();
        return this.ensureFound(
            await this.puntoRepository.update(punto._id!, {
                resuelto: valor,
                fechaArreglo: valor ? now : null,
                updatedAt: now,
            })
        );
    }

    async delete(id: string): Promise<void> {
        const deleted = await this.puntoRepository.delete(this.toObjectId(id));
        if (!deleted) {
            throw new NotFoundError("Punto no encontrado");
        }
    }

    // ---------------------------------------------------------------- validaciones

    private optionalString(value: unknown, field: string, max: number): string {
        if (value === undefined || value === null) return "";
        if (typeof value !== "string") {
            throw new BadRequestError(`El campo '${field}' debe ser un texto`);
        }
        const limpio = value.trim();
        if (limpio.length > max) {
            throw new BadRequestError(`El campo '${field}' admite máximo ${max} caracteres`);
        }
        return limpio;
    }

    private requireCategoria(value: unknown): Categoria {
        if (typeof value !== "string" || !CATEGORIAS.includes(value as Categoria)) {
            throw new BadRequestError(`El campo 'categoria' debe ser uno de: ${CATEGORIAS.join(", ")}`);
        }
        return value as Categoria;
    }

    private requireCoordenadas(lat: unknown, lng: unknown): { lat: number; lng: number } {
        if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
            throw new BadRequestError("El campo 'lat' es obligatorio y debe ser un número entre -90 y 90");
        }
        if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
            throw new BadRequestError("El campo 'lng' es obligatorio y debe ser un número entre -180 y 180");
        }
        return { lat, lng };
    }

    private toObjectId(id: string): ObjectId {
        if (!ObjectId.isValid(id)) {
            throw new BadRequestError(`Identificador inválido: ${id}`);
        }
        return new ObjectId(id);
    }

    private ensureFound(punto: Punto | null): Punto {
        if (!punto) {
            throw new NotFoundError("Punto no encontrado");
        }
        return punto;
    }
}
