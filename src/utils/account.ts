// utils/account.ts
import { useBookmarkStore } from "@/stores/bookmarks";
import { useProgressStore } from "@/stores/progress";

export interface User {
  username: string | null;
  image: string | null;
  user_id: bigint | null;
  newUser?: boolean;
  progress: any;
  bookmarks: any;
}

function updateLocalStorageItem(item: any, value: any) {
  const oldItem = localStorage.getItem(item);
  if (oldItem) {
    const jsonItem = JSON.parse(oldItem);
    if (jsonItem) {
      jsonItem.state = value;
      localStorage.setItem(item, JSON.stringify(jsonItem));

      return true;
    }
  }
  return false;
}

function updateLocalStorageProgress(value: any) {
  const res = updateLocalStorageItem("__MW::progress", { items: value });
  if (res) {
    // Update the progress store with the new progress items
    const replaceItems = useProgressStore.getState().replaceItems;
    replaceItems(value ?? {});
  }
}

function updateLocalStorageBookmarks(value: any) {
  const res = updateLocalStorageItem("__MW::bookmarks", { bookmarks: value });
  if (res) {
    // Update the progress store with the new progress items
    const replaceItems = useBookmarkStore.getState().replaceItems;
    replaceItems(value ?? {});
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

      data.rows.forEach((user: User) => {
        user.newUser = user.progress === null && user.bookmarks === null;
      });

      console.log("Fetched users:", data.rows);

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

  async editUser(id: bigint | null, username: string, image: string) {
    try {
      const response = await fetch(
        `https://movie-web-accounts.vercel.app/users/${id}/edit`,
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
      console.error("Error editing user:", error);
    }
  },

  getCurrentUser(): bigint | null {
    const account = localStorage.getItem("account");
    return account ? BigInt(account) : null;
  },

  setCurrentUser(id: bigint | null) {
    updateLocalStorageProgress({});
    updateLocalStorageBookmarks({});

    localStorage.setItem("account", id?.toString() ?? "");
  },

  async syncProfile(selectedUser: bigint | null = null) {
    /*
    Sync function that sends the current progress to the server
    Stores the last sync time in local storage to prevent spamming the server
    Stores the current progress in local storage

    Backend takes care of the merge and returns the updated progress
    
    */
    // Check if the last sync was less than 1.5 second ago
    const lastSync = getLastSync();
    if (lastSync && Date.now() - lastSync.getTime() < 1500) {
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

    let bookmarks = localStorage.getItem("__MW::bookmarks");
    if (bookmarks) {
      bookmarks = JSON.parse(bookmarks).state.bookmarks;
    }

    try {
      const response = await fetch(
        `https://movie-web-accounts.vercel.app/users/${selectedUser}/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            progress,
            bookmarks,
          }),
        },
      );
      const data = await response.json();
      if (data.error) {
        console.error("Error syncing profile:", data.error);
      } else {
        // Update local storage
        updateLocalStorageProgress(data.progress);
        updateLocalStorageBookmarks(data.bookmarks);
        console.log("Synced profile successfully");
        return data;
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
        updateLocalStorageProgress(data.progress);
      });
  },
  deleteBookmark(id: string) {
    const userId = localStorage.getItem("account");
    if (!userId) return;
    console.log(`Deleting bookmark for item ${id} for user ${userId}`);

    fetch(
      `https://movie-web-accounts.vercel.app/users/${userId}/bookmarks/item/${id}`,
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
        updateLocalStorageBookmarks(data.bookmarks);
      });
  },
};
