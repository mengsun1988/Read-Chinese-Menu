export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Edge Function is working",
        received: body
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
