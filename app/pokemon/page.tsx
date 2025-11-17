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

interface Pokemon {
  id: string;
  name: string;
  image_path: string;
  user_id: string;
  created_at: string;
  uploaderEmail?: string; // mapped from profiles
}

interface Review {
  id: string;
  pokemon_id: string;
  user_id: string;
  content: string;
  created_at: string;
  userEmail?: string; // mapped from profiles
}

export default function PokemonPage() {
  const supabase = createClient();

  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");

  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pokemonName, setPokemonName] = useState("");

  // ----------------
  // Fetch all Pokémon + map uploader email
  // ----------------
  useEffect(() => {
    fetchPokemons();
  }, []);

  const fetchPokemons = async () => {
    const { data: pokemonsData, error: pokemonError } = await supabase
      .from("pokemon")
      .select("*")
      .order("created_at", { ascending: false });

    if (pokemonError) {
      console.error("Error fetching Pokémon:", pokemonError);
      return;
    }

    const userIds = Array.from(new Set(pokemonsData.map((p) => p.user_id)));

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
    }

    const mapped = pokemonsData.map((p: any) => ({
      ...p,
      uploaderEmail:
        profiles?.find((profile) => profile.user_id === p.user_id)?.email ||
        p.user_id,
    }));

    setPokemons(mapped);
  };

  // ----------------
  // Fetch reviews + map reviewer email
  // ----------------
  const fetchReviews = async (pokemonId: string) => {
    const { data: reviewsData, error } = await supabase
      .from("pokemon_reviews")
      .select("*")
      .eq("pokemon_id", pokemonId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }

    const userIds = Array.from(new Set(reviewsData.map((r) => r.user_id)));

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);

    if (profileError) {
      console.error("Error fetching profiles for reviews:", profileError);
    }

    const mapped = reviewsData.map((r: any) => ({
      ...r,
      userEmail:
        profiles?.find((profile) => profile.user_id === r.user_id)?.email ||
        r.user_id,
    }));

    setReviews(mapped);
  };

  const openPokemon = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    fetchReviews(pokemon.id);
  };

  // ----------------
  // Upload Pokémon
  // ----------------
  const uploadPokemon = async () => {
    if (!uploadFile || !pokemonName.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const filePath = `pokemon/${user.id}/${uploadFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("pokemon")
      .upload(filePath, uploadFile, { upsert: true });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    const { data, error } = await supabase
      .from("pokemon")
      .insert({
        name: pokemonName,
        image_path: filePath,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert Pokémon error:", error);
      return;
    }

    setPokemons((prev) => [{ ...data, uploaderEmail: user.email }, ...prev]);
    setUploadFile(null);
    setPokemonName("");
  };

  // ----------------
  // Add/Edit/Delete Review
  // ----------------
  const addReview = async () => {
    if (!newReview.trim() || !selectedPokemon) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("pokemon_reviews")
      .insert({
        content: newReview,
        pokemon_id: selectedPokemon.id,
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

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.content);
  };

  const saveReview = async (review: Review) => {
    const { error } = await supabase
      .from("pokemon_reviews")
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

  const deleteReview = async (review: Review) => {
    const { error } = await supabase
      .from("pokemon_reviews")
      .delete()
      .eq("id", review.id);

    if (error) {
      console.error("Delete review error:", error);
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== review.id));
  };

  // ----------------
  // Filter + Sort Pokémon
  // ----------------
  const filteredPokemons = pokemons
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pokémon Review App</h1>

      {/* Upload Pokémon */}
      <div className="flex gap-2 mb-4">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
        />
        <Input
          placeholder="Pokémon name"
          value={pokemonName}
          onChange={(e) => setPokemonName(e.target.value)}
        />
        <Button onClick={uploadPokemon}>Upload Pokémon</Button>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search Pokémon..."
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

      {/* Pokémon Grid */}
      <ul className="grid grid-cols-3 gap-4">
        {filteredPokemons.map((pokemon) => (
          <li
            key={pokemon.id}
            className="border rounded overflow-hidden cursor-pointer"
            style={{ height: "200px" }} // increased height
          >
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center">
                  <img
                    src={
                      supabase.storage
                        .from("pokemon")
                        .getPublicUrl(pokemon.image_path).data.publicUrl
                    }
                    alt={pokemon.name}
                    className="h-32 w-full object-contain"
                    onClick={() => openPokemon(pokemon)}
                  />
                  <span className="mt-1 font-semibold text-center">
                    {pokemon.name}
                  </span>
                </div>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogTitle className="text-xl font-bold mb-1">
                  {pokemon.name}
                </DialogTitle>
                <span className="text-sm text-gray-500 mb-2">
                  Uploaded by: {pokemon.uploaderEmail}
                </span>
                <img
                  src={
                    supabase.storage
                      .from("pokemon")
                      .getPublicUrl(pokemon.image_path).data.publicUrl
                  }
                  alt={pokemon.name}
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
