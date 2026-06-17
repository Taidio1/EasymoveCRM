import { MappingEditor } from "@/components/mapping-editor"

export default async function EditMappingPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  return <MappingEditor templateId={templateId} />
}
