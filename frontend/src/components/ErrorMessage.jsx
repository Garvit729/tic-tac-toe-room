const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <p className="text-red-200 font-medium mb-2">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-300 hover:text-red-100 underline"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
