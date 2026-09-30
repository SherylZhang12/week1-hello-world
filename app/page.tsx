import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import Link from "next/link";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: foods, error } = await supabase
        .from("favorite_foods")
        .select("*")
        .order("id");

    return (
        <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
            <h1 className="text-3xl font-bold">My Favorite Foods</h1>
            {user ? (
                <div className="space-y-3 rounded border p-4">
                    <p>Signed in as {user.email}</p>
                    <p><Link href="/profile">Profile</Link> · <Link href="/private">Members-only page</Link></p>
                    <form action={signOut}><button type="submit" className="rounded bg-foreground px-4 py-2 text-background">Sign out</button></form>
                </div>
            ) : (
                <div className="space-y-3 rounded border p-4">
                    <p>Sign in to edit your profile and access the members-only page.</p>
                    <Link href="/login" className="underline">Sign in with Google</Link>
                </div>
            )}

            {error && <p role="alert">Could not load favorite foods. Please try again later.</p>}
            <ul className="space-y-3">
                {foods?.map((food) => (
                    <li key={food.id}>
                        {food.name} — {food.country} — {food.rating}/10
                    </li>
                ))}
            </ul>
        </main>
    );
}
