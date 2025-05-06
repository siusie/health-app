const pool = require("../../database/db");
const { checkBabyBelongsToUser } = require("../../src/utils/babyAccessHelper");

// tests/unit/babyAccessHelper.test.js
jest.mock("../../database/db", () => ({
  query: jest.fn(),
}));

describe("babyAccessHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkBabyBelongsToUser", () => {
    it("should return true when baby belongs to user", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await checkBabyBelongsToUser(1, 1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT baby_id FROM user_baby WHERE baby_id = $1 AND user_id = $2",
        [1, 1]
      );
    });

    it("should return false when baby does not belong to user", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await checkBabyBelongsToUser(1, 2);

      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT baby_id FROM user_baby WHERE baby_id = $1 AND user_id = $2",
        [1, 2]
      );
    });

    it("should return false when database query fails", async () => {
      pool.query.mockRejectedValueOnce(new Error("Database error"));

      const result = await checkBabyBelongsToUser(1, 1);

      expect(result).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT baby_id FROM user_baby WHERE baby_id = $1 AND user_id = $2",
        [1, 1]
      );
    });
  });
});
