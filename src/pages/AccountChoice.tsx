import { useEffect, useState } from "react";

import { AccountAvatar } from "@/components/Avatar";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { WideContainer } from "@/components/layout/WideContainer";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import "@/assets/css/addAccounts.css";
import { User, accountManager } from "@/utils/account";

export function AccountChoice() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<bigint | null>(null);

  const loadUsers = async () => {
    const fetchedUsers = await accountManager.getUsers();
    setUsers(fetchedUsers);
  };

  const addAccount = async () => {
    const username = prompt("Nom d'utilisateur:");
    const image = prompt("URL de l'image:");

    if (username && image) {
      const response = await accountManager.addUser(username, image);
      if (response) {
        console.log("Success:", response);
        loadUsers();
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
    loadUsers();
  };

  const selectUser = (id: bigint | null) => () => {
    accountManager.setCurrentUser(id);
    setSelectedUser(id);
  };

  const syncProfile = () => {
    accountManager.syncProfile(selectedUser);
  };

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
              Rafraichir
            </Button>
            <Button
              padding="p-2 ml-2"
              icon={Icons.UP_DOWN_ARROW}
              onClick={() => {
                syncProfile();
              }}
            >
              Synchroniser
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
