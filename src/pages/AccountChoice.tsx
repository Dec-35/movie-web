import { useEffect, useState } from "react";

import { AccountAvatar } from "@/components/Avatar";
import { Button } from "@/components/buttons/Button";
import { EditButton } from "@/components/buttons/EditButton";
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
  const [error, setError] = useState<string>("");

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
        setError("URL de l'image invalide");
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
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    await accountManager.deleteUser(id);
    console.log("User deleted", id, selectedUser);
    loadUsers();
    if (selectedUser === id) {
      setSelectedUser(null);
      localStorage.removeItem("account");
    }
    setMessage("Utilisateur supprimé");
  };

  const editAccount = async (id: bigint | null) => {
    const username = prompt("Nom d'utilisateur:");
    if (username) {
      const image = prompt("URL de l'image:");

      if (image) {
        const response = await accountManager.editUser(id, username, image);
        if (response.error) {
          setError(response.error);
        } else {
          console.log("Success:", response);
          setMessage("Utilisateur modifié avec succès");
          loadUsers();
        }
      } else {
        setError("URL de l'image invalide");
      }
    }
  };

  const selectUser = (id: bigint | null) => () => {
    const userToSelect = users.find((user) => user.user_id === id);
    if (userToSelect?.newUser) {
      localStorage.setItem("account", id?.toString() ?? "");
    } else {
      accountManager.setCurrentUser(id);
    }
    setSelectedUser(id);
  };

  const syncProfile = async () => {
    const syncIcon = document.querySelector(".syncIcon");
    syncIcon?.classList.remove("paused");
    accountManager.syncProfile(selectedUser).then((response) => {
      console.log("Sync response", response);
      if (response) setMessage("Profil synchronisé");
      else setError("Vous allez trop vite, attendez un peu");
      syncIcon?.classList.add("paused");
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const [editing, setEditing] = useState(false);

  return (
    <HomeLayout showBg={false}>
      <div className="mb-16 sm:mb-24" />
      <WideContainer classNames="relative mt-40">
        <SectionHeading title="Utilisateurs" icon={Icons.USER}>
          <EditButton editing={editing} onEdit={setEditing} />

          <button
            className="paused ml-2 spin flex h-12 items-center overflow-hidden rounded-full bg-background-secondary px-4 py-2 text-white transition-[background-color,transform] hover:bg-background-secondaryHover active:scale-105"
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
        <span className="flex justify-between mb-3">
          <p className="text-sm text-lime userMessage">{message}</p>
          <p className="text-sm text-lime userMessage red">{error}</p>
        </span>
        <div className="my-auto accounts-container p-4">
          <div className="usersList flex-wrap flex justify-center grow items-center">
            {users?.map((user) => (
              <div
                className={`user-${user.user_id} relative avatar-wrapper ${
                  selectedUser?.toString() === user.user_id?.toString() &&
                  !editing
                    ? "selected"
                    : ""
                }`}
                key={user.user_id}
                onClick={selectUser(user.user_id)}
              >
                <AccountAvatar
                  username={user.username ?? undefined}
                  iconImage={user.image ?? undefined}
                  deletable={editing}
                  delete={() => deleteAccount(user.user_id)}
                  selected={selectedUser === user.user_id}
                />
                <button
                  onClick={async (event) => {
                    event.stopPropagation();
                    await editAccount(user.user_id);
                  }}
                  type="button"
                  className={`absolute top-0 right-0 edit-button${
                    editing ? " hidden" : ""
                  }`}
                >
                  <Icon icon={Icons.EDIT} />
                </button>
              </div>
            ))}
            <div
              onClick={() => {
                addAccount();
              }}
              id="addAccount"
              className="hover:bg-background-secondaryHover m-4 bg-background-secondary account-avatar w-[2.5rem] h-[1.5rem] ssm:w-[2rem] ssm:h-[2rem] rounded-full overflow-hidden flex items-center justify-center text-white"
            >
              <Icon
                icon={Icons.PLUS}
                className="text-base ssm:text-xl smaller-icon"
              />
            </div>
          </div>
        </div>
        <span className="flex justify-center mt-10">
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
