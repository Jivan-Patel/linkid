import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileCard } from "./ProfileCard";
import { ProfileFooter } from "./ProfileFooter";

import type { Link } from "./types/type";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;

    return {
        title: `${username} | LinkID`,
        description: `Check out ${username}'s LinkID profile.`,
        openGraph: {
            title: `${username} | LinkID`,
            description: `Check out ${username}'s LinkID profile.`,
            url: `https://linkid.vercel.app/${username}`,
        },
    };
}

export default async function PublicProfile({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;
    const session = await getServerSession(authOptions);

    let user:
        | {
              name: string | null;
              username: string | null;
              bio: string | null;
              image: string | null;
              links: Link[];
          }
        | null = null;

    try {
        user = await prisma.user.findUnique({
            where: { username },
            select: {
                name: true,
                username: true,
                bio: true,
                image: true,
                links: {
                    orderBy: { order: "asc" },
                },
            },
        });
    } catch {
        // If the DB isn't reachable in local OSS setups, fall back to 404 instead of a huge error page.
        notFound();
    }

    if (!user) notFound();

    return (
        <main className="min-h-screen bg-muted/40 px-4 py-16">
            <div className="mx-auto max-w-md">
                <ProfileCard
                    user={{ name: user.name, username: username, bio: user.bio, image: user.image, links: user.links }}
                    username={username}
                    showCTA={!session}
                />
                <ProfileFooter />
            </div>
        </main>
    );
}
