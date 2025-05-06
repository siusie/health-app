import fetch from "node-fetch";

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res
      .status(400)
      .json({ status: "error", message: "Token is required" });
  }

  try {
    // Fetch the post data
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const postData = await res.json();
    console.log(postData);

    if (postData.status !== "ok") {
      return res
        .status(404)
        .json({ status: "error", message: "Cannot fetch post" });
    }

    return res.status(200).json({ status: "ok", posts: postData.data });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}
