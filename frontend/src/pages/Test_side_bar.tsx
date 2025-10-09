import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, User } from "@heroui/react";
import { useState } from "react";
import { IconSun } from "../components/common/Icons";

export default function TestSidebar() {
    const [isDark, setIsDark] = useState(false);

    function toggleTheme() {
        setIsDark((prev) => !prev);
        document.documentElement.classList.toggle("dark");
    }

    return (
        <div className="flex items-center gap-4">
            <button className="btn-ghost" aria-label="toggle-theme" onClick={toggleTheme} title="Toggle theme">
                <IconSun />
            </button>
            <Dropdown placement="bottom-start" backdrop="blur">
                <DropdownTrigger>
                    <User
                        as="button"
                        avatarProps={{
                            isBordered: true,
                            src: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
                            classNames: { img: "!opacity-100" },
                        }}
                        className="transition-transform"
                        description="@tonyreichert"
                        name="Tony Reichert"
                    />
                </DropdownTrigger>
                <DropdownMenu aria-label="User Actions" variant="flat">
                    <DropdownItem key="settings">My Settings</DropdownItem>
                    <DropdownItem key="team_settings">Team Settings</DropdownItem>
                    <DropdownItem key="analytics">Analytics</DropdownItem>
                    <DropdownItem key="system">System</DropdownItem>
                    <DropdownItem key="configurations">Configurations</DropdownItem>
                    <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
                    <DropdownItem key="logout" color="danger">
                        Log Out
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
}
