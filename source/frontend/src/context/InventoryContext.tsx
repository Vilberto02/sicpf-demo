import { createContext, useState } from "react";
import { Task } from "@/types";

export interface InventoryContextType {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateDataTask: (id: number, task: Task) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

/**
 *
 * @param param0
 * @returns
 */
export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  //const { authState } = useAuth();

  const fetchTasks = async () => {
    try {
      /*const response = await getTasks();
      const data = response.data;
      const dataSort = data.sort((a: Task, b: Task) => {
        return (b.id ?? 0) - (a.id ?? 0);
      });
      setTasks(dataSort);*/
    } catch (error) {
      console.log("Error al obtener las tareas.", error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (task: Task) => {
    try {
      //const response = await createTask(task);
      //setTasks((prev) => [...prev, response.data]);
      //toast.success("Se creó correctamente la tarea.");
    } catch (error) {
      console.log("Error al crear la tarea", error);
    }
  };

  const updateDataTask = async (id: number, task: Task) => {
    try {
      //await updateTask(id, task);
      setTasks((prev) => [...prev, task]);
      //toast.success("Se actualizó la tarea correctamente.");
    } catch (error) {
      console.log("Error al actualizar la tarea.", error);
    }
  };

  const removeTask = async (id: number) => {
    try {
      //await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      //toast.success("Se eliminó la tarea correctamente.");
    } catch (error) {
      console.log("Error al eliminar la tarea", error);
    }
  };

  /*useEffect(() => {
    if (authState.accessToken) {
      fetchTasks();
    }
  }, [!authState.accessToken]);*/

  return (
    <InventoryContext.Provider
      value={{
        tasks,
        loading,
        fetchTasks,
        addTask,
        updateDataTask,
        removeTask,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
