// This is a diagnostic component to help identify syntax issues
export function SyntaxCheck() {
  const config = {
    title: "Error",
    message: "Checking syntax",
    status: "ok",
  } // Make sure this object is properly closed

  return (
    <div>
      <h1>{config.title}</h1>
      <p>{config.message}</p>
    </div>
  )
}
