import { useEffect, useState } from "react";

import { AccountAvatar } from "@/components/Avatar";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { WideContainer } from "@/components/layout/WideContainer";
import { HomeLayout } from "@/pages/layouts/HomeLayout";

import "@/assets/css/addAccounts.css";

async function getUsers() {
  try {
    const response = await fetch("https://movie-web-accounts.vercel.app/users");
    const data = await response.json();
    return data.rows;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export function AccountChoice() {
  const [users, setUsers] = useState<
    {
      username: string | null;
      image: string | null;
      user_id: bigint | null;
    }[]
  >([]);

  const [selectedUser, setSelectedUser] = useState<bigint | null>(null);

  // Function to load users and update state
  const loadUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  function addAccount() {
    const username = prompt("Nom d'utilisateur:");
    const image = prompt("URL de l'image:");

    if (username && image) {
      fetch("https://movie-web-accounts.vercel.app/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ username, image }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Success:", data);
          loadUsers();
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }

  function getCurrentUser() {
    const account = localStorage.getItem("account");
    if (account) {
      setSelectedUser(BigInt(account));
      console.log("Selected user:", account);
    }
  }

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  async function deleteAccount(id: bigint | null) {
    try {
      fetch(`https://movie-web-accounts.vercel.app/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }).then(() => {
        loadUsers();
      });
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  const selectUser = (id: bigint | null) => () => {
    localStorage.setItem("account", id?.toString() ?? "");
    setSelectedUser(id);
  };

  function syncProfile() {
    if (!selectedUser) return;

    let progress = localStorage.getItem("__MW::progress");
    if (progress) {
      progress = JSON.parse(progress).state.items;
    }

    fetch(
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
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          // Update local storage
          const oldProgress = localStorage.getItem("__MW::progress");
          if (oldProgress) {
            const jsonProgress = JSON.parse(oldProgress);
            if (jsonProgress) {
              jsonProgress.state.items = data.progress;
              localStorage.setItem(
                "__MW::progress",
                JSON.stringify(jsonProgress),
              );
            }
          }

          alert("Synchronisation terminée !");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <HomeLayout showBg={false}>
      <div className="mb-16 sm:mb-24" />
      <WideContainer>
        <div className="my-auto accounts-container p-4">
          <span className="flex justify-between">
            <h3 className="text-type-emphasis">Utilisateurs</h3>
            <Button
              padding="p-2 ml-auto"
              icon={Icons.DRAGON}
              onClick={() => {
                loadUsers();
                getCurrentUser();
              }}
            >
              {" "}
              Rafraichir{" "}
            </Button>
            <Button
              padding="p-2 ml-2"
              icon={Icons.UP_DOWN_ARROW}
              onClick={() => {
                syncProfile();
              }}
            >
              {" "}
              Synchroniser{" "}
            </Button>
          </span>
          <div className="usersList flex-wrap flex gap-2 justify-center grow items-center">
            {users?.map((user) => (
              <div
                className={`user-${user.user_id} relative avatar-wrapper ${
                  selectedUser === user.user_id ? "selected" : ""
                }`}
                key={user.user_id}
                onClick={selectUser(user.user_id)}
              >
                <AccountAvatar
                  username={user.username ?? undefined}
                  iconImage={user.image ?? undefined}
                />
                <button
                  onClick={async () => {
                    await deleteAccount(user.user_id);
                  }}
                  type="button"
                  className="absolute top-0 right-0 close-button"
                />
              </div>
            ))}
            <div
              onClick={() => {
                addAccount();
              }}
              className=" account-avatar w-[3.5rem] h-[3.5rem] ssm:w-[2rem] ssm:h-[2rem] rounded-full overflow-hidden bg-type-dimmed flex items-center justify-center text-white"
            >
              <Icon
                icon={Icons.EDIT}
                className="text-base ssm:text-xl smaller-icon"
              />
            </div>
          </div>
        </div>
      </WideContainer>
    </HomeLayout>
  );
}
