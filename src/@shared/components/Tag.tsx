interface TagProps {
  text: string;
}

export default function Tag({ text }: TagProps) {
  return (
    <span className="inline-block px-4 py-4 text-base font-semibold text-center text-white shadow-xl whitespace-nowrap bg-main rounded-20">
      {text}
    </span>
  );
}
