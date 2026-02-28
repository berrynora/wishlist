import { Button } from "@/components/ui/Button/Button";
import styles from "./DashboardHeader.module.scss";
import { Plus } from "lucide-react";

type Props = {
  onNewWishlist: () => void;
};

export function DashboardHeader({ onNewWishlist }: Props) {
  return (
    <div className={styles.header}>
      <div>
        <h1>Good afternoon, Sarah</h1>
        <p>
          Manage your wishlists and discover what your friends are wishing for.
        </p>
      </div>

           <Button size="sm" onClick={onNewWishlist}>
                <Plus size={18} />
                <span>Add Wishlist</span>
              </Button>
    </div>
  );
}
