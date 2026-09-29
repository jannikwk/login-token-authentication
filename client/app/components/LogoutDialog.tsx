export const LOGOUT_DIALOG_ID = "logout-dialog";

type LogoutDialogProps = {
    onConfirm: () => void;
};

export default function LogoutDialog({ onConfirm }: LogoutDialogProps) {
    return (
        <dialog
            id={LOGOUT_DIALOG_ID}
            className="m-auto w-80 rounded-2xl border border-white bg-gray-800 p-6 text-white shadow-lg backdrop:bg-black/60"
        >
            <h2 className="text-lg font-bold text-center">Log out?</h2>
            <p className="mt-2 text-sm text-gray-300 text-center">
                Are you sure you want to log out?
            </p>
            <form method="dialog" className="mt-5 flex justify-center gap-3">
                <button
                    value="cancel"
                    className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-400 active:bg-gray-500"
                >
                    Cancel
                </button>
                <button
                    value="confirm"
                    onClick={onConfirm}
                    className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 active:bg-red-500"
                >
                    Logout
                </button>
            </form>
        </dialog>
    );
}
