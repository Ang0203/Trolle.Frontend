import { BoardCanvas } from "@/components/BoardCanvas";

type Props = {
    params: Promise<{ id: string }>
}

export default async function BoardPage(
    { params }: Props
) {
    const { id } = await params;

    return (
        <main className="flex min-h-screen flex-col items-center">
            <BoardCanvas boardId={id} />
        </main>
    );
}
