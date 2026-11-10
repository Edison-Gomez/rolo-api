import { Router } from "express";
import demoRoutes from "../../modules/demo/demo.routes";
import puntoRoutes from "../../modules/puntos/punto.routes";

const router = Router();

router.use("/demo", demoRoutes);
router.use("/puntos", puntoRoutes);

export default router;
