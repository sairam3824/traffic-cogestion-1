import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get("segmentId")

    if (!segmentId) {
      return NextResponse.json({ success: false, error: "segmentId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch predictions from all three models
    const [lstmData, gnnData, cnnGruData] = await Promise.all([
      supabase
        .from("predictions")
        .select("*")
        .eq("segment_id", segmentId)
        .eq("model_type", "lstm")
        .order("prediction_timestamp", { ascending: true })
        .limit(24),
      supabase
        .from("predictions")
        .select("*")
        .eq("segment_id", segmentId)
        .eq("model_type", "gnn")
        .order("prediction_timestamp", { ascending: true })
        .limit(24),
      supabase
        .from("predictions")
        .select("*")
        .eq("segment_id", segmentId)
        .eq("model_type", "cnn_gru")
        .order("prediction_timestamp", { ascending: true })
        .limit(24),
    ])

    if (lstmData.error || gnnData.error || cnnGruData.error) {
      throw new Error("Failed to fetch predictions")
    }

    return NextResponse.json({
      success: true,
      data: {
        segmentId,
        lstm: lstmData.data || [],
        gnn: gnnData.data || [],
        cnn_gru: cnnGruData.data || [],
      },
    })
  } catch (error) {
    console.error("Error comparing predictions:", error)
    return NextResponse.json({ success: false, error: "Failed to compare predictions" }, { status: 500 })
  }
}
