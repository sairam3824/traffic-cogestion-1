import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("model_performance")
      .select("*")
      .order("evaluation_date", { ascending: false })
      .limit(100)

    if (error) throw error

    // Group by model type and get latest metrics
    const metrics: Record<string, any> = {}
    ;(data || []).forEach((row: any) => {
      if (!metrics[row.model_type]) {
        metrics[row.model_type] = {
          modelType: row.model_type,
          metrics: {},
          evaluationDate: row.evaluation_date,
        }
      }

      metrics[row.model_type].metrics[row.metric_name] = row.metric_value
    })

    return NextResponse.json({ success: true, data: Object.values(metrics) })
  } catch (error) {
    console.error("Error fetching model performance:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch model performance" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("model_performance").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error("Error creating model performance record:", error)
    return NextResponse.json({ success: false, error: "Failed to create record" }, { status: 500 })
  }
}
