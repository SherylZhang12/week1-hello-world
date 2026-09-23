import { supabase } from "@/lib/supabase";

export default async function Home() {
    const { data: foods, error } = await supabase
        .from("favorite_foods")
        .select("*")
        .order("id");

    if (error) {
        return (
            <main>
                <h1>Error loading data</h1>
                <p>{error.message}</p>
            </main>
        );
    }

    return (
        <main>
            <h1>My Favorite Foods</h1>

            <ul>
                {foods?.map((food) => (
                    <li key={food.id}>
                        {food.name} — {food.country} — {food.rating}/10
                    </li>
                ))}
            </ul>
        </main>
    );
}