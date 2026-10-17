// TODO: remove this free route before submission (replaced by the paid x402 endpoint).
import { NextResponse } from "next/server";
import { isPubkey } from "@/lib/minda/base58";
import { checkToken } from "@/lib/minda/report";
