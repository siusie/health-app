import fetch from "node-fetch";

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res
      .status(400)
      .json({ status: "error", message: "Token is required" });
  }

  try {
    // Fetch the user data
    const userRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/user/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const userData = await userRes.json();

    if (userData.status !== "ok") {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const userId = userData.id;

    // Fetch the list of baby IDs from your API or database
    const babyRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${userId}/getAllBabyProfiles`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const babyData = await babyRes.json();

    if (babyData.status !== "ok") {
      return res
        .status(404)
        .json({ status: "error", message: "No baby profiles found" });
    }
    console.log(babyData);

    return res.status(200).json({ status: "ok", babies: babyData.babies });
  } catch (error) {
    console.error("Error fetching baby profiles:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}
