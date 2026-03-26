export default function ParagraphBlock({ paragraphs }) {
  if (!paragraphs || paragraphs.length === 0) {
    return null;
  }

  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}