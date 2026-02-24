import React, { useState } from "react";

type BottlePosition = "upright" | "tilted";
type MentosAmount = "one" | "multiple";
type DropStyle = "single" | "step";


const OPTION_IMAGES = {
    upright: "https://i.imgur.com/TUO6R4D.png",
    tilted: "https://i.imgur.com/yW2nKRB.png",
    one: "https://i.imgur.com/2ZeiuAU.png",
    multiple: "https://i.imgur.com/2zmwhXB.png",
    single: "https://i.imgur.com/cEBiryu.png",
    step: "https://i.imgur.com/Ob5XOFz.png",
};

const RESULT_IMAGES = {
    upright_one: "https://i.imgur.com/fmp2pOy.png",
    tilted_one: "https://i.imgur.com/WC9HUMn.png",
    upright_multiple_single: "https://i.imgur.com/o4BuLw4.png",
    upright_multiple_step: "https://i.imgur.com/2dhOwfr.png",
    tilted_multiple_single: "https://i.imgur.com/IpJ97Nw.png",
    tilted_multiple_step: "https://i.imgur.com/BUQ2IlW.png",
};

export default function CokeExperiment() {
    const [position, setPosition] = useState<BottlePosition>("upright");
    const [amount, setAmount] = useState<MentosAmount>("one");
    const [dropStyle, setDropStyle] = useState<DropStyle>("step");

    const getResultImage = () => {
        if (amount === "one") {
            return position === "upright" ? RESULT_IMAGES.upright_one : RESULT_IMAGES.tilted_one;
        }

        return RESULT_IMAGES[`${position}_multiple_${dropStyle}` as keyof typeof RESULT_IMAGES];
    };

    return (
        <div style={styles.page}>
            <div style={styles.wrapper}>
                <div style={styles.left}>
                    <h2 style={{ marginBottom: "5%" }}>Coca + Mentos Filter</h2>

                    <Section title="Bottle Position">
                        <OptionCard
                            label="Upright"
                            image={OPTION_IMAGES.upright}
                            checked={position === "upright"}
                            onClick={() => setPosition("upright")}
                        />
                        <OptionCard
                            label="Tilted"
                            image={OPTION_IMAGES.tilted}
                            checked={position === "tilted"}
                            onClick={() => setPosition("tilted")}
                        />
                    </Section>

                    <Section title="Mentos Amount">
                        <OptionCard
                            label="One"
                            image={OPTION_IMAGES.one}
                            checked={amount === "one"}
                            onClick={() => {
                                setAmount("one");
                                setDropStyle("step");
                            }}
                        />
                        <OptionCard
                            label="Multiple"
                            image={OPTION_IMAGES.multiple}
                            checked={amount === "multiple"}
                            onClick={() => setAmount("multiple")}
                        />
                    </Section>

                    <Section title="Drop Style">
                        <OptionCard
                            label="All at once"
                            image={OPTION_IMAGES.single}
                            checked={dropStyle === "single"}
                            disabled={amount === "one"}
                            onClick={() => setDropStyle("single")}
                        />
                        <OptionCard
                            label="One by one"
                            image={OPTION_IMAGES.step}
                            checked={dropStyle === "step"}
                            disabled={amount === "one"}
                            onClick={() => setDropStyle("step")}
                        />
                    </Section>
                </div>

                <div style={styles.right}>
                    <img src={getResultImage()} alt="Result" style={styles.resultImage} />
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={styles.group}>
            <h4 style={{ marginBottom: "4%" }}>{title}</h4>
            <div style={styles.optionRow}>{children}</div>
        </div>
    );
}

function OptionCard({
    label,
    image,
    checked,
    onClick,
    disabled,
}: {
    label: string;
    image: string;
    checked: boolean;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <div
            onClick={!disabled ? onClick : undefined}
            style={{
                ...styles.optionCard,
                border: checked ? "2px solid #ff3c3c" : "1px solid #333",
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
            }}
        >
            <div style={styles.imageWrapper}>
                <img src={image} alt={label} style={styles.optionImage} />
            </div>

            <div style={styles.optionInfo}>
                <div
                    style={{
                        ...styles.customCheckbox,
                        backgroundColor: checked ? "#22c55e" : "transparent",
                        borderColor: checked ? "#22c55e" : "#666",
                    }}
                >
                    {checked && <span style={styles.checkMark}>✓</span>}
                </div>

                <span>{label}</span>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        background: "#0f0f0f",
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontFamily: "sans-serif",
        padding: "2%",
    },

    wrapper: {
        display: "flex",
        gap: "5%",
        alignItems: "stretch",
        width: "95%",
        maxWidth: "1600px",
    },

    left: {
        flex: 1,
        background: "#1a1a1a",
        padding: "3%",
        borderRadius: "20px",
    },

    group: {
        marginBottom: "6%",
    },

    optionRow: {
        display: "flex",
        gap: "4%",
        flexWrap: "wrap",
    },

    optionCard: {
        flex: 1,
        minWidth: "45%",
        display: "flex",
        alignItems: "center",
        gap: "5%",
        padding: "3%",
        borderRadius: "16px",
        background: "#141414",
        transition: "all 0.2s ease",
    },

    imageWrapper: {
        width: "45%",
        aspectRatio: "1 / 1",
        background: "#B9CF9E",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    optionImage: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },

    optionInfo: {
        display: "flex",
        alignItems: "center",
        gap: "10%",
    },

    customCheckbox: {
        width: "1.6rem",
        height: "1.6rem",
        borderRadius: "6px",
        border: "2px solid #666",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    checkMark: {
        color: "#0f0f0f",
        fontWeight: "bold",
    },

    right: {
        flex: 1,
        aspectRatio: "1 / 1",
        background: "#B9CF9E",
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    resultImage: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },
};
