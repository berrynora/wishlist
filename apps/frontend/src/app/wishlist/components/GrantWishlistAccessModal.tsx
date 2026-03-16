"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Search,
  Shield,
  SquarePen,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { useFriends } from "@/hooks/use-friends";
import { useGrantWishlistAccess } from "@/hooks/use-wishlists";
import type { FriendWithDetails } from "@/api/types/friends";
import styles from "./GrantWishlistAccessModal.module.scss";

type AccessType = 0 | 1;

type Props = {
  open: boolean;
  onClose: () => void;
  wishlistId: string;
  wishlistTitle: string;
};

const ACCESS_OPTIONS: Array<{
  value: AccessType;
  label: string;
  description: string;
  icon: typeof Shield;
}> = [
  {
    value: 0,
    label: "View access",
    description: "Can open the wishlist and keep track of its updates.",
    icon: Shield,
  },
  {
    value: 1,
    label: "Edit access",
    description: "Can add, update, and manage items in this wishlist.",
    icon: SquarePen,
  },
];

const FRIEND_PAGE_SIZE = 100;

function friendSearchText(friend: FriendWithDetails) {
  return `${friend.display_name} ${friend.nickname ?? ""}`.trim().toLowerCase();
}

export function GrantWishlistAccessModal({
  open,
  onClose,
  wishlistId,
  wishlistTitle,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedFriend, setSelectedFriend] =
    useState<FriendWithDetails | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accessType, setAccessType] = useState<AccessType>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: friends = [],
    isLoading: friendsLoading,
    isError: friendsError,
  } = useFriends({
    skip: 0,
    take: FRIEND_PAGE_SIZE,
  });
  const grantAccess = useGrantWishlistAccess();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedFriend(null);
      setDropdownOpen(false);
      setAccessType(1);
      setErrorMessage(null);
      grantAccess.reset();
    }
  }, [grantAccess, open]);

  const filteredFriends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return friends;

    return friends.filter((friend) =>
      friendSearchText(friend).includes(normalizedQuery),
    );
  }, [friends, query]);

  const canSubmit = Boolean(selectedFriend) && !grantAccess.isPending;
  const showDropdown =
    dropdownOpen &&
    !selectedFriend &&
    (Boolean(query.trim()) || friendsLoading || filteredFriends.length > 0);

  async function handleSubmit() {
    if (!selectedFriend) return;

    setErrorMessage(null);

    try {
      await grantAccess.mutateAsync({
        wishlistId,
        grantedToUserId: selectedFriend.friend_id,
        accessType,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to grant access.";
      setErrorMessage(message);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.heroIcon}>
            <KeyRound size={18} />
          </div>
          <p className={styles.eyebrow}>Access control</p>
          <h2>Grant wishlist access</h2>
          <p>
            Choose a friend and decide whether they can only view or also edit
            <span className={styles.inlineTitle}> {wishlistTitle}</span>.
          </p>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Choose a friend</label>
          <div className={styles.searchField}>
            <Search size={16} />
            <input
              value={selectedFriend ? `@${selectedFriend.nickname}` : query}
              onChange={(event) => {
                setSelectedFriend(null);
                setQuery(event.target.value);
                setDropdownOpen(true);
                setErrorMessage(null);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search among your friends"
            />
            <button
              type="button"
              className={styles.chevronButton}
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="Toggle friend list"
            >
              <ChevronDown
                size={16}
                className={dropdownOpen ? styles.chevronOpen : ""}
              />
            </button>

            {showDropdown && (
              <div className={styles.searchDropdown}>
                {friendsLoading && (
                  <div className={styles.emptyState}>
                    <Loader2 size={16} className={styles.spinner} />
                    <span>Loading friends...</span>
                  </div>
                )}

                {!friendsLoading && friendsError && (
                  <div className={styles.emptyState}>
                    Could not load your friends right now.
                  </div>
                )}

                {!friendsLoading &&
                  !friendsError &&
                  filteredFriends.length === 0 && (
                    <div className={styles.emptyState}>
                      No matching friends found.
                    </div>
                  )}

                {!friendsLoading &&
                  !friendsError &&
                  filteredFriends.length > 0 && (
                    <div className={styles.resultsList}>
                      {filteredFriends.map((friend) => (
                        <button
                          key={friend.id}
                          type="button"
                          className={styles.resultItem}
                          onClick={() => {
                            setSelectedFriend(friend);
                            setQuery(friend.nickname ?? friend.display_name);
                            setDropdownOpen(false);
                            setErrorMessage(null);
                          }}
                        >
                          <div className={styles.avatarStub}>
                            {(
                              friend.nickname?.[0] ??
                              friend.display_name?.[0] ??
                              "?"
                            ).toUpperCase()}
                          </div>
                          <div className={styles.resultMeta}>
                            <span className={styles.resultName}>
                              {friend.display_name}
                            </span>
                            <span className={styles.resultNickname}>
                              @{friend.nickname}
                            </span>
                          </div>
                          {selectedFriend?.friend_id === friend.friend_id && (
                            <Check size={16} className={styles.resultCheck} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {selectedFriend && (
            <div className={styles.selectedCard}>
              <div className={styles.selectedIdentity}>
                <div className={styles.avatarStub}>
                  {(
                    selectedFriend.nickname?.[0] ??
                    selectedFriend.display_name?.[0] ??
                    "?"
                  ).toUpperCase()}
                </div>
                <div>
                  <p>{selectedFriend.display_name}</p>
                  <span>@{selectedFriend.nickname}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => {
                  setSelectedFriend(null);
                  setQuery("");
                  setDropdownOpen(true);
                }}
              >
                Change
              </button>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Access level</label>
          <div className={styles.accessGrid}>
            {ACCESS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = accessType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.accessCard} ${active ? styles.accessCardActive : ""}`}
                  onClick={() => setAccessType(option.value)}
                >
                  <div className={styles.accessIcon}>
                    <Icon size={16} />
                  </div>
                  <div className={styles.accessContent}>
                    <span className={styles.accessLabel}>{option.label}</span>
                    <span className={styles.accessDescription}>
                      {option.description}
                    </span>
                  </div>
                  {active && <Check size={16} className={styles.accessCheck} />}
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && <div className={styles.error}>{errorMessage}</div>}

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={grantAccess.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {grantAccess.isPending ? "Granting access..." : "Confirm access"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
