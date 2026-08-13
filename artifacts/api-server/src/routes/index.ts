import { Router, type IRouter } from "express";
import healthRouter from "./health";
import liftLogRouter from "./lift-log";

const router: IRouter = Router();

router.use(healthRouter);
router.use(liftLogRouter);

export default router;
