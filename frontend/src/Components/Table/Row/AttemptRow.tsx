import { IconButton, Td, Tr, useToast } from "@chakra-ui/react";
import { Attempt, Result } from "../../../logic/interfaces";
import { attemptWithPenaltyToString } from "../../../logic/resultFormatters";
import { MdDelete, MdEdit } from "react-icons/md";
import { useState } from "react";
import { deleteAttempt } from "../../../logic/attempt";
import Alert from "../../Alert";
import EditAttemptModal from "../../Modal/EditAttemptModal";

interface AttemptRowProps {
    attempt: Attempt;
    result: Result;
    showExtraColumns?: boolean;
    fetchData: () => void;
    no: number;
}

const AttemptRow: React.FC<AttemptRowProps> = ({
    attempt,
    showExtraColumns = false,
    fetchData,
    no,
    result,
}) => {
    const toast = useToast();
    const [openConfirmation, setOpenConfirmation] = useState<boolean>(false);
    const [isOpenEditAttemptModal, setIsOpenEditAttemptModal] =
        useState<boolean>(false);

    const handleDelete = async () => {
        setOpenConfirmation(true);
    };

    const handleCancel = () => {
        setOpenConfirmation(false);
    };

    const handleConfirm = async () => {
        setOpenConfirmation(false);
        const status = await deleteAttempt(attempt.id);
        if (status === 204) {
            toast({
                title: "Successfully deleted attempt.",
                status: "success",
                duration: 9000,
                isClosable: true,
            });
            fetchData();
        } else {
            toast({
                title: "Error",
                description: "Something went wrong",
                status: "error",
                duration: 9000,
                isClosable: true,
            });
        }
    };

    const handleCloseEditModal = async () => {
        fetchData();
        setIsOpenEditAttemptModal(false);
    };

    return (
        <>
            <Tr key={attempt.id}>
                <Td>{no}</Td>
                <Td>
                    {attempt.isExtraAttempt
                        ? `Extra ${attempt.attemptNumber}`
                        : attempt.attemptNumber}
                </Td>
                <Td>{attemptWithPenaltyToString(attempt)}</Td>
                {showExtraColumns && (
                    <>
                        <Td>
                            {attempt.replacedBy &&
                                `Extra ${attempt.replacedBy}`}
                        </Td>
                        <Td>
                            {attempt.isDelegate
                                ? attempt.isResolved
                                    ? "Resolved"
                                    : "Not resolved"
                                : null}
                        </Td>
                    </>
                )}
                <Td>
                    {attempt.judge && attempt.judge.name}
                    {attempt.judge &&
                        attempt.judge.registrantId &&
                        ` (${attempt.judge.registrantId})`}
                </Td>
                <Td>{attempt.device && attempt.device.name}</Td>
                <Td>{attempt.comment}</Td>
                <Td>{new Date(attempt.solvedAt).toLocaleString()}</Td>
                <Td>
                    <IconButton
                        icon={<MdEdit />}
                        aria-label="Edit"
                        bg="none"
                        color="white"
                        _hover={{
                            background: "none",
                            color: "gray.400",
                        }}
                        title="Edit attempt"
                        onClick={() => setIsOpenEditAttemptModal(true)}
                    />
                    <IconButton
                        icon={<MdDelete />}
                        aria-label="Delete"
                        bg="none"
                        color="white"
                        _hover={{
                            background: "none",
                            color: "gray.400",
                        }}
                        title="Delete attempt"
                        onClick={handleDelete}
                    />
                </Td>
            </Tr>
            <Alert
                isOpen={openConfirmation}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                title="Delete attempt"
                description="Are you sure you want to delete this attempt? This action cannot be undone"
            />
            <EditAttemptModal
                isOpen={isOpenEditAttemptModal}
                onClose={handleCloseEditModal}
                attempt={attempt}
                result={result}
            />
        </>
    );
};

export default AttemptRow;
