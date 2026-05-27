import { Navigate, useParams } from "react-router-dom";
import { EngineMental } from "./EngineMental";
import { EnginePhysical } from "./EnginePhysical";
import { Goal } from "./Goal";

const taskMap = {
  talk: { engine: "mental", module: "checkin", action: "talk" },
  food: { engine: "physical", module: "food", action: "food" },
  sleep: { engine: "physical", module: "sleep", action: "sleep" },
  stretch: { engine: "physical", module: "stretch", action: "stretch" },
  scan: { engine: "physical", module: "scan", action: "scan" },
  reset: { engine: "mental", module: "reset", action: "reset" },
  confidence: { engine: "mental", module: "purpose", action: "confidence" },
  social: { engine: "mental", module: "checkin", action: "social" },
  screen: { engine: "mental", module: "reset", action: "screen" }
} as const;

export function TaskPage() {
  const { taskId } = useParams();

  if (taskId === "goal") return <Goal />;
  const task = taskId ? taskMap[taskId as keyof typeof taskMap] : undefined;
  if (!task) return <Navigate to="/home" replace />;

  if (task.engine === "physical") {
    return <EnginePhysical initialModule={task.module} initialAction={task.action} standalone />;
  }

  return <EngineMental initialModule={task.module} initialAction={task.action} standalone />;
}
