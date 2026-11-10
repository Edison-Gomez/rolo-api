import { Collection, Filter, ObjectId } from "mongodb";
import { getDb } from "../../config/database";
import { FiltrosPuntos, Punto } from "./punto.model";

export class PuntoRepository {

    // El índice geoespacial se crea una sola vez por arranque del servidor.
    private static indiceListo: Promise<string> | null = null;

    private collection(): Collection<Punto> {
        const collection = getDb().collection<Punto>("puntos");
        if (!PuntoRepository.indiceListo) {
            PuntoRepository.indiceListo = collection.createIndex({ ubicacion: "2dsphere" });
        }
        return collection;
    }

    async create(data: Omit<Punto, "_id">): Promise<Punto> {
        const result = await this.collection().insertOne(data as Punto);
        return { _id: result.insertedId, ...data };
    }

    async findAll(filtros: FiltrosPuntos): Promise<Punto[]> {
        const collection = this.collection();
        await PuntoRepository.indiceListo;

        const query: Filter<Punto> = {};
        if (filtros.categoria) query.categoria = filtros.categoria;
        if (filtros.resuelto !== undefined) query.resuelto = filtros.resuelto;

        if (filtros.cerca) {
            // $nearSphere devuelve los puntos ordenados del más cercano al más lejano.
            query.ubicacion = {
                $nearSphere: {
                    $geometry: { type: "Point", coordinates: [filtros.cerca.lng, filtros.cerca.lat] },
                    $maxDistance: filtros.cerca.radio,
                },
            };
            return collection.find(query).limit(filtros.limite).toArray();
        }

        return collection.find(query).sort({ createdAt: -1 }).limit(filtros.limite).toArray();
    }

    async findById(id: ObjectId): Promise<Punto | null> {
        return this.collection().findOne({ _id: id });
    }

    async update(id: ObjectId, changes: Partial<Punto>): Promise<Punto | null> {
        return this.collection().findOneAndUpdate(
            { _id: id },
            { $set: changes },
            { returnDocument: "after" }
        );
    }

    // Suma 1 a las confirmaciones sin tener que leer el documento antes.
    async confirmar(id: ObjectId): Promise<Punto | null> {
        return this.collection().findOneAndUpdate(
            { _id: id },
            { $inc: { confirmaciones: 1 }, $set: { updatedAt: new Date() } },
            { returnDocument: "after" }
        );
    }

    async delete(id: ObjectId): Promise<boolean> {
        const result = await this.collection().deleteOne({ _id: id });
        return result.deletedCount === 1;
    }
}
