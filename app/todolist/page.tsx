"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  priority: string;
}

export default function TodosPage() {
  const supabase = createClient();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPriority, setEditingPriority] = useState("");
  const [priority, setPriority] = useState("low");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (error) console.log(error);
    else setTodos(data);
  };

  const addTodo = async () => {
    if (!title.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("todos")
      .insert({
        title,
        user_id: user?.id,
        priority: priority,
      })
      .select()
      .single();

    if (error) console.error(error);

    setTodos((prev) => [...prev, data]);
    setTitle("");
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("todos")
      .update({ completed: !completed })
      .eq("id", id);

    if (error) console.error(error);

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
    );
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
    setEditingPriority(todo.priority);
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("todos")
      .update({ title: editingText, priority: editingPriority })
      .eq("id", id);

    if (error) console.error(error);

    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: editingText, priority: editingPriority }
          : t
      )
    );

    setEditingId(null);
    setEditingText("");
    setEditingPriority("");
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) console.error(error);

    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Todos</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select onValueChange={(value) => setPriority(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Priority</SelectLabel>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={addTodo}>Add</Button>
      </div>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-center gap-2">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
            />

            {editingId === todo.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={editingPriority}
                  onValueChange={(value) => setEditingPriority(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Priority</SelectLabel>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button onClick={() => saveEdit(todo.id)}>Save</Button>
              </div>
            ) : (
              <div className="flex-1 flex justify-between items-center">
                <span
                  className={`${todo.completed ? "line-through" : ""} flex-1`}
                >
                  {todo.title}
                </span>
                <span className="mx-5 inline-flex items-center px-3 py-0.5 rounded-full bg-gray-200 text-xs font-medium uppercase">
                  {todo.priority}
                </span>
                <div>
                  <Button onClick={() => startEditing(todo)} className="mr-2">
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
