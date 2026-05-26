import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { validatePlatformUrl, detectPlatform } from "@/lib/platforms";
import { validateUrlBackend } from "@/lib/urlValidation";
import { PLATFORM_ICONS } from "@/lib/platformIcons";

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const url = body?.url;
    const isPublic = body?.isPublic;
    const label = body?.label;
    const platform = body?.platform;

    const rawExplicitPlatform = typeof platform === "string" ? platform.trim() : null;
    const explicitPlatform = rawExplicitPlatform && Object.keys(PLATFORM_ICONS).includes(rawExplicitPlatform)
        ? rawExplicitPlatform
        : null;

    const link = await prisma.link.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!link || link.user.email !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: { url?: string; isPublic?: boolean; label?: string; platform?: string } = {};

    const activeUrl = typeof url === "string" ? url : link.url;
    const activeLabel = typeof label === "string" ? label.trim() : link.label;

    if (typeof label === "string") {
        if (!activeLabel) {
            return NextResponse.json(
                { error: "Please enter a name for this link" },
                { status: 400 }
            );
        }
        data.label = activeLabel;
    }

    if (typeof url === "string") {
        const validation = validateUrlBackend(url);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const finalUrl = validation.normalizedUrl;

        // Derive platform from the final URL or dropdown for validation so custom user-defined
        // platform slugs (e.g. when platform was stored as a custom label) don't
        // cause a runtime exception in `validatePlatformUrl`.
        const platformForValidation = explicitPlatform || detectPlatform(finalUrl);

        if (!validatePlatformUrl(platformForValidation, finalUrl)) {
            return NextResponse.json(
                { error: "Please enter a valid public link" },
                { status: 400 }
            );
        }

        data.url = finalUrl;
    }

    // Always derive and update platform to synchronize changes on url, label, or dropdown selection
    const finalUrlForPlatform = data.url || link.url;
    const detectedPlatform = explicitPlatform || detectPlatform(finalUrlForPlatform);
    let finalPlatform: string;

    if (detectedPlatform === "website") {
        finalPlatform = activeLabel
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        if (!finalPlatform) {
            return NextResponse.json(
                { error: "Please enter a valid alphanumeric name for this link" },
                { status: 400 }
            );
        }
    } else {
        finalPlatform = detectedPlatform;
    }

    if (finalPlatform !== link.platform) {
        data.platform = finalPlatform;
    }

    if (typeof isPublic === "boolean") {
        data.isPublic = isPublic;
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    try {
        await prisma.link.update({
            where: { id },
            data,
        });

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const error = err as { code?: string };
        if (error?.code === "P2002") {
            const labelForErrorMessage = typeof label === "string" ? label.trim() : link.label;
            return NextResponse.json(
                { error: `You already added your ${labelForErrorMessage} link.` },
                { status: 409 }
            );
        }
        console.error("Link update error:", err);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const link = await prisma.link.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!link || link.user.email !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.link.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}