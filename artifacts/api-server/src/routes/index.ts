import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sosRouter from "./sos";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/sos", sosRouter);

export default router;
