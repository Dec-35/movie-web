// utils/account.ts

export interface User {
  username: string | null;
  image: string | null;
  user_id: bigint | null;
}

function updateLocalStorageProgress(value: any) {
  const oldProgress = localStorage.getItem("__MW::progress");
  if (oldProgress) {
    const jsonProgress = JSON.parse(oldProgress);
    if (jsonProgress) {
      jsonProgress.state.items = value.progress;
      localStorage.setItem("__MW::progress", JSON.stringify(jsonProgress));
    }
  }
}

function getLastSync() {
  const lastSync = localStorage.getItem("lastSync");
  if (lastSync) {
    return new Date(parseInt(lastSync, 10));
  }
  return null;
}

function setLastSync() {
  localStorage.setItem("lastSync", Date.now().toString());
}

export const accountManager = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(
        "https://movie-web-accounts.vercel.app/users",
      );
      const data = await response.json();
      return data.rows;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async addUser(username: string, image: string) {
    try {
      const response = await fetch(
        "https://movie-web-accounts.vercel.app/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ username, image }),
        },
      );
      return await response.json();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  },

  async deleteUser(id: bigint | null) {
    try {
      await fetch(`https://movie-web-accounts.vercel.app/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  },

  getCurrentUser(): bigint | null {
    const account = localStorage.getItem("account");
    return account ? BigInt(account) : null;
  },

  setCurrentUser(id: bigint | null) {
    localStorage.setItem("account", id?.toString() ?? "");
  },

  async syncProfile(selectedUser: bigint | null = null) {
    /*
    Sync function that sends the current progress to the server
    Stores the last sync time in local storage to prevent spamming the server
    Stores the current progress in local storage

    Backend takes care of the merge and returns the updated progress
    
    */
    // Check if the last sync was less than 10 seconds ago
    const lastSync = getLastSync();
    if (lastSync && Date.now() - lastSync.getTime() < 10000) {
      console.log("Syncing too soon");
      return;
    }
    setLastSync();

    if (!selectedUser) {
      const userId = localStorage.getItem("account");
      if (!userId) return;
      selectedUser = BigInt(userId);
    }

    let progress = localStorage.getItem("__MW::progress");
    if (progress) {
      progress = JSON.parse(progress).state.items;
    }

    try {
      const response = await fetch(
        `https://movie-web-accounts.vercel.app/users/${selectedUser}/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            progress,
          }),
        },
      );
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        // Update local storage
        updateLocalStorageProgress(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  },
  deleteProgress(id: string) {
    const userId = localStorage.getItem("account");
    if (!userId) return;
    console.log(`Deleting progress for item ${id} for user ${userId}`);

    fetch(
      `https://movie-web-accounts.vercel.app/users/${userId}/progress/item/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        updateLocalStorageProgress(data);
      });
  },
};
