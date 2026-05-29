import BoardBriefingPanel from "@/components/BoardBriefingPanel";
import Section from "@/components/Section";

export default function BoardBriefing() {
  return (
    <div className="space-y-4">
      <Section
        title="Synthetic board briefing generator"
        description="Assemble synthetic risk, storage, water quality, capital, and document context into a structured, traceable briefing."
        bodyClassName="p-4 lg:p-6"
      >
        <BoardBriefingPanel />
      </Section>
    </div>
  );
}
