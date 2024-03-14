import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormLabel,
    Input,
    Select,
    useToast,
} from "@chakra-ui/react";
import { Modal } from "./Modal";
import { useEffect, useState } from "react";
import { Attempt, Person, Result } from "../../logic/interfaces";
import { updateAttempt } from "../../logic/attempt";
import { useAtomValue } from "jotai";
import { competitionAtom } from "../../logic/atoms";
import { checkTimeLimit } from "../../logic/results";
import { getAllPersons } from "../../logic/persons";

interface EditAttemptModalProps {
    isOpen: boolean;
    onClose: () => void;
    attempt: Attempt;
    result: Result;
}

const EditAttemptModal: React.FC<EditAttemptModalProps> = ({
    isOpen,
    onClose,
    attempt,
    result,
}): JSX.Element => {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const competition = useAtomValue(competitionAtom);
    const [persons, setPersons] = useState<Person[]>([]);

    const [editedAttempt, setEditedAttempt] = useState<Attempt>(attempt);
    const [shouldResubmitToWcaLive, setShouldResubmitToWcaLive] =
        useState<boolean>(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        setIsLoading(true);
        event.preventDefault();

        const status = await updateAttempt({
            ...editedAttempt,
            shouldResubmitToWcaLive,
        });
        if (status === 200) {
            toast({
                title: "Successfully updated attempt.",
                status: "success",
                duration: 9000,
                isClosable: true,
            });
            onClose();
        } else {
            toast({
                title: "Error",
                description: "Something went wrong",
                status: "error",
                duration: 9000,
                isClosable: true,
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const fetchPersonsData = async () => {
            const data = await getAllPersons();
            setPersons(data);
        };
        fetchPersonsData();
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit attempt">
            <Box
                display="flex"
                flexDirection="column"
                gap="5"
                as="form"
                onSubmit={handleSubmit}
            >
                <FormControl isRequired>
                    <FormLabel>Attempt number</FormLabel>
                    <Input
                        placeholder="Attempt number"
                        _placeholder={{ color: "white" }}
                        value={editedAttempt.attemptNumber}
                        disabled={isLoading}
                        onChange={(e) =>
                            setEditedAttempt({
                                ...editedAttempt,
                                attemptNumber: +e.target.value,
                            })
                        }
                    />
                </FormControl>
                <Checkbox
                    isChecked={editedAttempt.isExtraAttempt}
                    onChange={(e) =>
                        setEditedAttempt({
                            ...editedAttempt,
                            isExtraAttempt: e.target.checked,
                        })
                    }
                >
                    Is extra attempt
                </Checkbox>
                <FormControl isRequired>
                    <FormLabel>Time</FormLabel>
                    <Input
                        placeholder="Time"
                        _placeholder={{ color: "white" }}
                        value={editedAttempt.value}
                        disabled={isLoading}
                        onChange={(e) => {
                            if (!competition) {
                                setEditedAttempt({
                                    ...editedAttempt,
                                    value: +e.target.value,
                                });
                                return;
                            }
                            const isLimitPassed = checkTimeLimit(
                                +e.target.value,
                                competition?.wcif,
                                result.roundId
                            );
                            if (!isLimitPassed) {
                                toast({
                                    title: "This attempt not passed time limit.",
                                    description: "This time is DNF.",
                                    status: "error",
                                    duration: 9000,
                                    isClosable: true,
                                });
                                setEditedAttempt({
                                    ...editedAttempt,
                                    value: +e.target.value,
                                    penalty: -1,
                                });
                                return;
                            }
                            setEditedAttempt({
                                ...editedAttempt,
                                value: +e.target.value,
                            });
                        }}
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>Judge</FormLabel>
                    <Select
                        placeholder="Select judge"
                        _placeholder={{ color: "white" }}
                        value={editedAttempt.judgeId}
                        disabled={isLoading}
                        onChange={(e) =>
                            setEditedAttempt({
                                ...editedAttempt,
                                judgeId: +e.target.value,
                            })
                        }
                    >
                        {persons.map((person) => (
                            <option key={person.id} value={person.id}>
                                {person.name} ({person.registrantId})
                            </option>
                        ))}
                    </Select>
                </FormControl>
                <FormControl>
                    <FormLabel>Comment</FormLabel>
                    <Input
                        placeholder="Comment"
                        _placeholder={{ color: "white" }}
                        value={editedAttempt.comment}
                        disabled={isLoading}
                        onChange={(e) =>
                            setEditedAttempt({
                                ...editedAttempt,
                                comment: e.target.value,
                            })
                        }
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>Penalty</FormLabel>
                    <Select
                        placeholder="Select penalty"
                        _placeholder={{ color: "white" }}
                        value={editedAttempt.penalty}
                        disabled={isLoading}
                        onChange={(e) =>
                            setEditedAttempt({
                                ...editedAttempt,
                                penalty: +e.target.value,
                            })
                        }
                    >
                        <option value={0}>No penalty</option>
                        <option value={2}>+2</option>
                        <option value={-1}>DNF</option>
                        <option value={-2}>DNS</option>
                        <option value={4}>+4</option>
                        <option value={6}>+6</option>
                        <option value={8}>+8</option>
                        <option value={10}>+10</option>
                        <option value={12}>+12</option>
                        <option value={14}>+14</option>
                        <option value={16}>+16</option>
                    </Select>
                </FormControl>
                {editedAttempt.extraGiven && (
                    <FormControl>
                        <FormLabel>Replaced by</FormLabel>
                        <Input
                            placeholder="Replaced by"
                            _placeholder={{ color: "white" }}
                            value={editedAttempt.replacedBy}
                            disabled={isLoading}
                            onChange={(e) =>
                                setEditedAttempt({
                                    ...editedAttempt,
                                    replacedBy: +e.target.value,
                                })
                            }
                        />
                    </FormControl>
                )}
                <Checkbox
                    isChecked={editedAttempt.isDelegate}
                    onChange={(e) =>
                        setEditedAttempt({
                            ...editedAttempt,
                            isDelegate: e.target.checked,
                        })
                    }
                >
                    Is delegate case
                </Checkbox>
                {editedAttempt.isDelegate && (
                    <>
                        <Checkbox
                            isChecked={editedAttempt.isResolved}
                            onChange={(e) =>
                                setEditedAttempt({
                                    ...editedAttempt,
                                    isResolved: e.target.checked,
                                })
                            }
                        >
                            Is resolved
                        </Checkbox>
                        <Checkbox
                            isChecked={editedAttempt.extraGiven}
                            onChange={(e) =>
                                setEditedAttempt({
                                    ...editedAttempt,
                                    extraGiven: e.target.checked,
                                })
                            }
                        >
                            Extra given
                        </Checkbox>
                    </>
                )}
                <Checkbox
                    isChecked={shouldResubmitToWcaLive}
                    onChange={(e) =>
                        setShouldResubmitToWcaLive(e.target.checked)
                    }
                >
                    Resubmit to WCA Live
                </Checkbox>
                <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="end"
                    gap="5"
                >
                    {!isLoading && (
                        <Button colorScheme="red" onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        colorScheme="green"
                        type="submit"
                        isLoading={isLoading}
                    >
                        Save
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
export default EditAttemptModal;