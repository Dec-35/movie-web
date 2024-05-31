import { useEffect, useState } from "react";

import { AccountAvatar } from "@/components/Avatar";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { WideContainer } from "@/components/layout/WideContainer";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import "@/assets/css/addAccounts.css";
import { User, accountManager } from "@/utils/account";

export function AccountChoice() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<bigint | null>(null);
  const [message, setMessage] = useState<string>("");

  const loadUsers = async () => {
    const fetchedUsers = await accountManager.getUsers();
    setUsers(fetchedUsers);
  };

  const addAccount = async () => {
    const username = prompt("Nom d'utilisateur:");
    if (username) {
      const image = prompt("URL de l'image:");

      if (image) {
        const response = await accountManager.addUser(username, image);
        if (response) {
          console.log("Success:", response);
          setMessage("Utilisateur ajouté avec succès");
          loadUsers();
        }
      } else {
        setMessage("URL de l'image invalide");
      }
    }
  };

  const getCurrentUser = () => {
    const userId = accountManager.getCurrentUser();
    setSelectedUser(userId);
  };

  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  const deleteAccount = async (id: bigint | null) => {
    await accountManager.deleteUser(id);
    console.log("User deleted", id, selectedUser);
    loadUsers();
    if (selectedUser === id) {
      setSelectedUser(null);
      localStorage.removeItem("account");
    }
    setMessage("Utilisateur supprimé");
  };

  const selectUser = (id: bigint | null) => () => {
    accountManager.setCurrentUser(id);
    setSelectedUser(id);
  };

  const syncProfile = async () => {
    const syncIcon = document.querySelector(".syncIcon");
    syncIcon?.classList.remove("paused");
    accountManager.syncProfile(selectedUser).then(() => {
      setMessage("Profil synchronisé");
      syncIcon?.classList.add("paused");
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <HomeLayout showBg={false}>
      <div className="mb-16 sm:mb-24" />
      <WideContainer classNames="relative mt-40">
        <SectionHeading title="Utilisateurs" icon={Icons.USER}>
          <button
            className="paused spin flex h-12 items-center overflow-hidden rounded-full bg-background-secondary px-4 py-2 text-white transition-[background-color,transform] hover:bg-background-secondaryHover active:scale-105"
            type="button"
            id="refresh"
            onClick={async () => {
              const button = document.getElementById("refresh");
              button?.classList.remove("paused");
              loadUsers()
                .then((result) => {
                  getCurrentUser();
                  button?.classList.add("paused");
                  setMessage("Liste des utilisateurs mis à jour");
                })
                .catch((err) => {
                  console.error(err);
                });
            }}
          >
            <Icon icon={Icons.REFRESH} />
          </button>
        </SectionHeading>
        <p className="text-sm text-lime userMessage">{message}</p>
        <div className="my-auto accounts-container p-4">
          <div className="usersList flex-wrap flex justify-center grow items-center">
            {users?.map((user) => (
              <div
                className={`user-${user.user_id} relative avatar-wrapper ${
                  selectedUser?.toString() === user.user_id?.toString()
                    ? "selected"
                    : ""
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
              id="addAccount"
              className="hover:bg-background-secondaryHover bg-background-secondary account-avatar w-[2.5rem] h-[1.5rem] ssm:w-[2rem] ssm:h-[2rem] rounded-full overflow-hidden flex items-center justify-center text-white"
            >
              <Icon
                icon={Icons.PLUS}
                className="text-base ssm:text-xl smaller-icon"
              />
            </div>
          </div>
        </div>
        <span className="flex justify-center mt-6">
          <button
            onClick={() => {
              syncProfile();
            }}
            type="button"
            disabled={!selectedUser}
          >
            <span
              className={` bg-background-secondary flex items-center justify-center rounded-full py-2 px-4${
                selectedUser
                  ? " text-white hover:bg-background-secondaryHover"
                  : ""
              }`}
            >
              <Icon
                icon={Icons.SYNC}
                className="text-base ssm:text-xl spin paused syncIcon mr-2"
              />
              Synchroniser
            </span>
          </button>
        </span>
      </WideContainer>
    </HomeLayout>
  );
}
