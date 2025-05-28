interface Group {
    Name: string;
    Icon: string;
    Parent: string | null;
    IsPublic: boolean;
    IsHidden: boolean;
    Classes: {
        Command: number;
        Member: number;
        Leader: number;
        Officer: number;
    };
    Ranks: {
        [key: string]: string;
    };
}

export default Group;