"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

interface Food {
  id: string;
  name: string;
  image_path: string;
  user_id: string;
  created_at: string;
  uploaderEmail?: string;
}

interface FoodReview {
  id: string;
  food_id: string;
  user_id: string;
  content: string;
  created_at: string;
  userEmail?: string;
}

export default function FoodPage() {
  const supabase = createClient();

  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [reviews, setReviews] = useState<FoodReview[]>([]);
  const [newReview, setNewReview] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [foodName, setFoodName] = useState("");

  // ----------------
  // Fetch all foods + map uploader email
  // ----------------
  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    const { data: foodsData, error: foodsError } = await supabase
      .from("food")
      .select("*")
      .order("created_at", { ascending: false });

    if (foodsError) {
      console.error("Error fetching foods:", foodsError);
      return;
    }

    const userIds = Array.from(new Set(foodsData.map((f) => f.user_id)));

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
    }

    const mapped = foodsData.map((f: any) => ({
      ...f,
      uploaderEmail:
        profiles?.find((profile) => profile.id === f.user_id)?.email ||
        f.user_id,
    }));

    setFoods(mapped);
  };

  // ----------------
  // Fetch reviews + map reviewer email
  // ----------------
  const fetchReviews = async (foodId: string) => {
    const { data: reviewsData, error } = await supabase
      .from("food_reviews")
      .select("*")
      .eq("food_id", foodId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }

    const userIds = Array.from(new Set(reviewsData.map((r) => r.user_id)));

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    if (profileError) {
      console.error("Error fetching profiles for reviews:", profileError);
    }

    const mapped = reviewsData.map((r: any) => ({
      ...r,
      userEmail:
        profiles?.find((profile) => profile.id === r.user_id)?.email ||
        r.user_id,
    }));

    setReviews(mapped);
  };

  const openFood = (food: Food) => {
    setSelectedFood(food);
    fetchReviews(food.id);
  };

  // ----------------
  // Upload food
  // ----------------
  const uploadFood = async () => {
    if (!uploadFile || !foodName.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    console.log("User:", userData);

    const filePath = `food/${user.id}/${uploadFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("food")
      .upload(filePath, uploadFile, { upsert: true });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    const { data, error } = await supabase
      .from("food")
      .insert({
        name: foodName,
        image_path: filePath,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert food error:", error);
      return;
    }

    setFoods((prev) => [{ ...data, uploaderEmail: user.email }, ...prev]);
    setUploadFile(null);
    setFoodName("");
  };

  // ----------------
  // Add/Edit/Delete Review
  // ----------------
  const addReview = async () => {
    if (!newReview.trim() || !selectedFood) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("food_reviews")
      .insert({
        content: newReview,
        food_id: selectedFood.id,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Add review error:", error);
      return;
    }

    setReviews((prev) => [{ ...data, userEmail: user.email }, ...prev]);
    setNewReview("");
  };

  const startEditReview = (review: FoodReview) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.content);
  };

  const saveReview = async (review: FoodReview) => {
    const { error } = await supabase
      .from("food_reviews")
      .update({ content: editingReviewText })
      .eq("id", review.id);

    if (error) {
      console.error("Update review error:", error);
      return;
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === review.id ? { ...r, content: editingReviewText } : r
      )
    );

    setEditingReviewId(null);
    setEditingReviewText("");
  };

  const deleteReview = async (review: FoodReview) => {
    const { error } = await supabase
      .from("food_reviews")
      .delete()
      .eq("id", review.id);

    if (error) {
      console.error("Delete review error:", error);
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== review.id));
  };

  // ----------------
  // Filter + Sort
  // ----------------
  const filteredFoods = foods
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Food Review App</h1>

      {/* Upload Food */}
      <div className="flex gap-2 mb-4">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
        />
        <Input
          placeholder="Food name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
        />
        <Button onClick={uploadFood}>Upload Food</Button>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search Food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select onValueChange={(value: "name" | "date") => setSortBy(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="date">Upload Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Food Grid */}
      <ul className="grid grid-cols-3 gap-4">
        {filteredFoods.map((food) => (
          <li
            key={food.id}
            className="border rounded overflow-hidden cursor-pointer"
            style={{ height: "200px" }}
          >
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center">
                  <img
                    src={
                      supabase.storage
                        .from("food")
                        .getPublicUrl(food.image_path).data.publicUrl
                    }
                    alt={food.name}
                    className="h-32 w-full object-contain"
                    onClick={() => openFood(food)}
                  />
                  <span className="mt-1 font-semibold text-center">
                    {food.name}
                  </span>
                </div>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogTitle className="text-xl font-bold mb-1">
                  {food.name}
                </DialogTitle>
                <span className="text-sm text-gray-500 mb-2">
                  Uploaded by: {food.uploaderEmail}
                </span>
                <img
                  src={
                    supabase.storage.from("food").getPublicUrl(food.image_path)
                      .data.publicUrl
                  }
                  alt={food.name}
                  className="h-48 w-full object-contain mb-4 rounded"
                />

                {/* Reviews */}
                <div className="flex flex-col gap-2 mb-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border p-2 rounded flex flex-col"
                    >
                      {editingReviewId === review.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editingReviewText}
                            onChange={(e) =>
                              setEditingReviewText(e.target.value)
                            }
                          />
                          <Button onClick={() => saveReview(review)}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p>{review.content}</p>
                          <span className="text-xs text-gray-500">
                            by {review.userEmail}
                          </span>
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => startEditReview(review)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteReview(review)}
                            >
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add review */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a review..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                  />
                  <Button onClick={addReview}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </li>
        ))}
      </ul>
    </div>
  );
}
