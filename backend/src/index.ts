import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Ledger is running on port ${PORT}`);
});
