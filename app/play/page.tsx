import { Simulator } from "@/components/simulator/Simulator";
import { coverage } from "@/lib/simulator/repository";
export const dynamic = "force-dynamic";
export default async function Play() {
  return <Simulator coverage={await coverage()} />;
}
