import { Package, ShoppingCart, Sparkles, TriangleAlert, User } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import { DoughnutChart } from "../charts/DougnutChart";
import { BarChart } from "../charts/BarChart";

export function ProfileSection(){
  const name = "Carlos"
  const lastname = "Rodriguez"
  const colors = ["#DBAEFF", "#D0E8FF", "#FBE38E", "#A9F4D0"];
  const values = [100, 80, 40, 10];
  const labels = ["Pastillas", "Jarabes", "Inyecciones", "Otros"];
  const valuesData01 = [120, 400, 700, 900, 1500];
  const valuesData02 = [80, 200, 400, 800, 1100];
  const labelDate = ["Enero", "Febrero", "Marzo", "Abril", "Mayo"];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
        <User width={42} height={42}></User>
        <h3>Mi Perfil</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-neutral-400 border-2 rounded-2xl flex items-center gap-6 p-6 w-full">
          <div className="bg-neutral-300 flex justify-center items-center p-0.5 text-3xl font-semibold text-primary w-40 h-40 rounded-full">
            {name.charAt(0) + lastname.charAt(0)}
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="font-semibold text-2xl">
              {name} {lastname}
            </h5>
            <p className="font-normal text-neutral-500">Control de calidad</p>
            <p className="font-normal text-neutral-500">San Miguel</p>
            <Button variant={"outline"}>ID: EMP-2024-001</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
          <CardDashboard
            title="Pedidos procesados"
            value="150"
            Icon={ShoppingCart}
            variant="default"
          ></CardDashboard>
          <CardDashboard
            title="Productos ingresados"
            value="150"
            Icon={Package}
            variant="info"
          ></CardDashboard>
          <CardDashboard
            title="Productos en riesgo"
            value="10"
            Icon={TriangleAlert}
            variant="danger"
          ></CardDashboard>
          <CardDashboard
            title="Tendencia de consumo"
            value="12 %"
            Icon={Sparkles}
            variant="success"
          ></CardDashboard>
        </div>
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          <DoughnutChart
            colors={colors}
            values={values}
            labels={labels}
          ></DoughnutChart>
        </div>
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          <BarChart dataset01={valuesData01} dataset02={valuesData02} label={labelDate} ></BarChart>
        </div>
      </div>
    </div>
  );
}