import { Router } from "express";
import { PuntoController } from "./punto.controller";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";

const router = Router();
const puntoController = new PuntoController();

router.post("/", asyncHandler(puntoController.create));
router.get("/", asyncHandler(puntoController.findAll));
router.get("/:id", asyncHandler(puntoController.findById));
router.put("/:id", asyncHandler(puntoController.update));
router.delete("/:id", asyncHandler(puntoController.delete));

// Acciones propias de Rolo
router.post("/:id/confirmar", asyncHandler(puntoController.confirmar));
router.patch("/:id/estado", asyncHandler(puntoController.cambiarEstado));

export default router;
