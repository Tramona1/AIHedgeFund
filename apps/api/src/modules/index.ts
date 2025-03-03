"use strict";

import { Router } from "express";
import authRouter from "./auth/auth.routes";
import userRouter from "./user/user.routes";
import symbolsRouter from "./symbols/symbols.routes";
import watchlistRouter from "./watchlist/watchlist.routes";
import alertsRouter from "./alerts/alerts.routes";
import stocksRouter from "./stocks/stocks.routes";
import aiRouter from "./ai/ai.routes";
import financialDataRouter from "./financial-data/financial-data.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/symbols", symbolsRouter);
router.use("/watchlist", watchlistRouter);
router.use("/alerts", alertsRouter);
router.use("/stocks", stocksRouter);
router.use("/ai", aiRouter);
router.use("/financial-data", financialDataRouter);

export default router; 