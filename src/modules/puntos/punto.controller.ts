import { Request, Response } from "express";
import { aRespuesta } from "./punto.model";
import { PuntoService } from "./punto.service";

export class PuntoController {

    private readonly puntoService = new PuntoService();

    create = async (req: Request, res: Response): Promise<void> => {
        const punto = await this.puntoService.create(req.body);
        res.status(201).json(aRespuesta(punto));
    };

    findAll = async (req: Request, res: Response): Promise<void> => {
        const puntos = await this.puntoService.findAll(req.query as Record<string, unknown>);
        res.status(200).json(puntos.map(aRespuesta));
    };

    findById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const punto = await this.puntoService.findById(req.params.id);
        res.status(200).json(aRespuesta(punto));
    };

    update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const punto = await this.puntoService.update(req.params.id, req.body);
        res.status(200).json(aRespuesta(punto));
    };

    confirmar = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const punto = await this.puntoService.confirmar(req.params.id);
        res.status(200).json(aRespuesta(punto));
    };

    cambiarEstado = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        const punto = await this.puntoService.cambiarEstado(req.params.id, req.body?.resuelto);
        res.status(200).json(aRespuesta(punto));
    };

    delete = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
        await this.puntoService.delete(req.params.id);
        res.status(204).send();
    };
}
