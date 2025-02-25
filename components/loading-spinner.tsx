export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
    </div>
  );
}
