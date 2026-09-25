import { Router, type IRouter } from "express";
import healthRouter from "./health";
import liftLogRouter from "./lift-log";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(liftLogRouter);

export default router;
